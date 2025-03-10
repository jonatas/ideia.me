---
title: "Customize RuboCop Layout/ClassStructure cop"
layout: post
tags: ['ruby RuboCop']
description: "I'm really proud to announce my new contribuition to RuboCop."
---
I'm really proud to announce my new contribuition to RuboCop.

Some days ago I contributed improving the
[development](https://rubocop.readthedocs.io/en/latest/development/) page,
creating a getting started guide and also creating a new tutorial to explain how [Node
Pattern](https://rubocop.readthedocs.io/en/latest/node_pattern/) works.

Now, the [Layout/ClassStructure](https://rubocop.readthedocs.io/en/latest/cops_layout/#layoutclassstructure)
cop was merged and it allows us to specify
the order of the elements in the class definition.

Initially it follows the [community style guide](https://github.com/bbatsov/ruby-style-guide#consistent-classes)
and follows the order:

1. Include, Extend or Prepend First
2. Constants
3. Initializer
4. Public methods
5. Protected methods
6. Private methods

It's also very easy to extend the cop and include new rules in the middle.

The basic configuration says:

```
Layout/ClassStructure:
  Enabled: false
  Categories:
    module_inclusion:
      - include
      - prepend
      - extend
  ExpectedOrder:
      - module_inclusion
      - constants
      - public_class_methods
      - initializer
      - instance_methods
      - protected_methods
      - private_methods
```

Lets imagine you got sad about people saying `validates` after define methods
and also mess with other macros from ActiveRecord.

Lets say we want to have strict rules in Rails models and use the following
order:

1. Include, Extend or Prepend First
2. Constants
3. Attributes (attribute, attr_accessor, attr_reader, attr_writer)
4. Associations (belongs_to, has_many, has_and_belongs_to_many ...)
5. Validations (validate, validates_presence_of, validates_uniqueness_of ...)
6. Hooks (before_save, after_save, after_initialize ...)
7. Initializer
8. Public methods
9. Protected methods
10. Private methods

Now we need to setup `Categories` and include them in the `ExpectedOrder`.

```
Layout/ClassStructure:
  Enabled: true
  Categories:
    module_inclusion:
      - include
      - prepend
      - extend
    attributes:
      - attribute
      - attr_reader
      - attr_writer
      - attr_accessor
    associations:
      - has_one
      - has_many
      - belongs_to
      - has_and_belongs_to_many
    validations:
      - validate
      - validates_presence_of
      - validates_uniqueness_of
    hooks:
      - after_save
      - after_create
      - after_initialize
  ExpectedOrder:
      - module_inclusion
      - constants
      - attributes
      - associations
      - validations
      - hooks
      - public_class_methods
      - initializer
      - public_methods
      - protected_methods
      - private_methods
```

Now it's ready to be tested.

Lets use a example with a few mistakes:

```
class User

  validate :name, :email, presence: true

  attr_reader :temporary_orders

  validates_uniqueness_of :email

  def email_domain
    email.split('@').last
  end

  has_many :orders
  after_create :send_welcome_email

  belongs_to :location
end
```

It supports autocorrect, and running it you can check that RuboCop has a kind of loop to keep autocorrecting until it's perfect.

```
user.rb:3:3: C: [Corrected] Layout/ClassStructure: attributes is supposed to appear before associations.
  attr_reader :temporary_orders
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
user.rb:3:3: C: [Corrected] Layout/ClassStructure: attributes is supposed to appear before validations.
  attr_reader :temporary_orders
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
user.rb:5:3: C: [Corrected] Layout/ClassStructure: associations is supposed to appear before hooks.
  belongs_to :location
  ^^^^^^^^^^^^^^^^^^^^
user.rb:5:3: C: [Corrected] Layout/ClassStructure: associations is supposed to appear before validations.
  has_many :orders
  ^^^^^^^^^^^^^^^^
user.rb:6:3: C: [Corrected] Layout/ClassStructure: associations is supposed to appear before validations.
  belongs_to :location
  ^^^^^^^^^^^^^^^^^^^^
user.rb:6:3: C: [Corrected] Layout/ClassStructure: validations is supposed to appear before hooks.
  validate :name, :email, presence: true
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
user.rb:8:3: C: [Corrected] Layout/ClassStructure: validations is supposed to appear before hooks.
  validates_uniqueness_of :email
  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
```

This feature is very cool because allow the cops algorithm simply execute one 
[swap](https://github.com/bbatsov/rubocop/blob/master/lib/rubocop/cop/layout/class_structure.rb#L144-L150) between the
nodes that are not in the proper place. Then you can see it in action [recursively](https://github.com/bbatsov/rubocop/blob/f72860cf9f879d8ecef19b30624d777d8cc3bd80/lib/rubocop/runner.rb#L194)
until the file is totally organized.

After autocorrect the file looks like this:

```
class User

  attr_reader :temporary_orders
  has_many :orders
  belongs_to :location
  validates_uniqueness_of :email
  validate :name, :email, presence: true
  after_create :send_welcome_email


  def email_domain
    email.split('@').last
  end
end
```

So, that is what this cop does. I hope this cop to be useful for the community and
make our code classes more organized. If you're interested in the full history you can
check my Pull Request [here](https://github.com/bbatsov/rubocop/pull/5065).
